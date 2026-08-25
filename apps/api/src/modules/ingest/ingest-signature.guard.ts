import { CanActivate, ExecutionContext, Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class IngestSignatureGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    throw new NotImplementedException();
  }
}
