import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RevisionService } from './revision.service';
import { RevisionResponseDto, RevisionCountsDto } from './dto/revision-response.dto';

@ApiTags('revision')
@Controller('revision')
export class RevisionController {
  constructor(private readonly revisionService: RevisionService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los items pendientes de revisión' })
  @ApiResponse({ status: 200, type: RevisionResponseDto })
  async getRevision(): Promise<RevisionResponseDto> {
    return this.revisionService.getRevision();
  }

  @Get('counts')
  @ApiOperation({ summary: 'Obtener solo los conteos de items pendientes' })
  @ApiResponse({ status: 200, type: RevisionCountsDto })
  async getCounts(): Promise<RevisionCountsDto> {
    return this.revisionService.getCounts();
  }
}
