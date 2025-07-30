import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import * as multer from 'multer';
import { s3CategoryImageStorage } from '../s3-category-image-storage';

@Injectable()
export class CategoryImageUploadInterceptor implements NestInterceptor {
  private upload: multer.Multer;

  constructor(private configService: ConfigService) {
    this.upload = multer({
      storage: s3CategoryImageStorage(this.configService),
      limits: {
        fileSize: parseInt(this.configService.get('MAX_FILE_SIZE')) || 5242880, // 5MB default
        files: 1, // Only one image per category
      },
      fileFilter: (req, file, cb) => {
        // Only allow image files for category_image
        if (file.fieldname === 'category_image') {
          if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            cb(null, true);
          } else {
            cb(new BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed for category images'));
          }
        } else {
          cb(new BadRequestException('Invalid field name. Only category_image field is allowed'));
        }
      },
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return new Observable((observer) => {
      this.upload.single('category_image')(request, response, (error) => {
        if (error) {
          if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
              observer.error(new BadRequestException('File size too large. Maximum size is 5MB'));
            } else if (error.code === 'LIMIT_FILE_COUNT') {
              observer.error(new BadRequestException('Only one image allowed per category'));
            } else {
              observer.error(new BadRequestException(`File upload error: ${error.message}`));
            }
          } else {
            observer.error(error);
          }
        } else {
          next.handle().subscribe({
            next: (data) => observer.next(data),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        }
      });
    });
  }
}