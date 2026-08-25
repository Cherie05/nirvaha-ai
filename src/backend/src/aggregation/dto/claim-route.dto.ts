import { IsString, IsNotEmpty } from 'class-validator';

export class ClaimRouteDto {
  @IsString()
  @IsNotEmpty()
  zone: string;

  @IsString()
  @IsNotEmpty()
  vendorId: string;
}
