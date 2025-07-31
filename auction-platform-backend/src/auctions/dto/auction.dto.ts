import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateAuctionDto {
  @ApiProperty({ example: 'Vintage Watch', description: 'Title of the auction' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'A beautiful vintage watch from 1950s', description: 'Description of the auction item' })
  @IsString()
  description: string;

  @ApiProperty({ example: 100.00, description: 'Starting price of the auction' })
  @IsNumber()
  startingPrice: number;

  @ApiProperty({ example: '2025-05-24T12:00:00Z', description: 'Start time of the auction' })
  @IsDateString()
  startTime: Date;

  @ApiProperty({ example: '2025-05-31T12:00:00Z', description: 'End time of the auction' })
  @IsDateString()
  endTime: Date;
}

export class UpdateAuctionDto {
  @ApiPropertyOptional({ example: 'Updated Vintage Watch', description: 'Title of the auction' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'An updated description', description: 'Description of the auction item' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 150.00, description: 'Starting price of the auction' })
  @IsOptional()
  @IsNumber()
  startingPrice?: number;

  @ApiPropertyOptional({ example: '2025-05-24T12:00:00Z', description: 'Start time of the auction' })
  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @ApiPropertyOptional({ example: '2025-05-31T12:00:00Z', description: 'End time of the auction' })
  @IsOptional()
  @IsDateString()
  endTime?: Date;
}

export class PlaceBidDto {
  @ApiProperty({ example: 200.00, description: 'Bid amount' })
  @IsNumber()
  amount: number;
}
