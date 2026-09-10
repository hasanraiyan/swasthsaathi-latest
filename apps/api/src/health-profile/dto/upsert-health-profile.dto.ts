import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { BLOOD_GROUPS, type BloodGroup } from '../schemas/health-profile.schema.js';

export class UpsertHealthProfileDto {
  @ApiPropertyOptional({ type: Number, minimum: 30, maximum: 300, description: 'Height in centimetres' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  heightCm?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 500, description: 'Weight in kilograms' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  weightKg?: number;

  @ApiPropertyOptional({ type: String, enum: BLOOD_GROUPS })
  @IsOptional()
  @IsIn(BLOOD_GROUPS)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiPropertyOptional({ type: String, description: 'Freeform basic health history / notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
