import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  IsOptional,
} from 'class-validator';

export class AddBinItemDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  /** Which scan this came from, so the same photo cannot be binned twice. */
  @IsOptional()
  @IsString()
  scanId?: string;

  @IsString()
  @IsNotEmpty()
  zone: string;

  @IsString()
  @IsNotEmpty()
  materialType: string;

  @IsNumber()
  @Min(0)
  weightGrams: number;
}
