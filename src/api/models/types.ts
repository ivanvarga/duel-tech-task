export enum Platform {
  Instagram = 'Instagram',
  TikTok = 'TikTok',
  Facebook = 'Facebook'
}

export enum DataQualitySeverity {
  Clean = 'clean',
  Warning = 'warning',
  Error = 'error'
}

export enum FailedImportErrorType {
  JsonParseError = 'json_parse_error',
  ValidationError = 'validation_error',
  TransformationError = 'transformation_error',
  DatabaseError = 'database_error'
}

export enum FailedImportStatus {
  Failed = 'failed',
  Retrying = 'retrying',
  Fixed = 'fixed',
  Ignored = 'ignored'
}
