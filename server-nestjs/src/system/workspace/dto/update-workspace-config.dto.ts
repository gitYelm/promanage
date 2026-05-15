import { PartialType } from '@nestjs/mapped-types'
import { CreateWorkspaceConfigDto } from './create-workspace-config.dto'

export class UpdateWorkspaceConfigDto extends PartialType(CreateWorkspaceConfigDto) {}
