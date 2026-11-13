import type { BaseEntity } from '../types';

export type ScienceTaskLevel = 'national' | 'provincial' | 'local' | 'rural_mountain' | 'unknown';

export const normalizeScienceTaskText = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Prefer the record's declared management level. Only inspect managing
 * agencies/program metadata when that field is absent or inconclusive.
 * Never infer a local-level task from the name of its host university alone.
 */
export const getScienceTaskLevel = (record: BaseEntity): ScienceTaskLevel => {
  const explicit = normalizeScienceTaskText(
    record.managementLevel || record.management_level || record.taskLevel || record.level || ''
  );

  const classify = (value: string): ScienceTaskLevel => {
    if (!value) return 'unknown';

    if (/du an nong thon mien nui|nong thon mien nui/.test(value)) return 'rural_mountain';
    if (/cap co so|cap truong|co so/.test(value)) return 'local';
    if (/(^| )bo($| )|quoc gia|nha nuoc|cap bo|bo khoa hoc|bo kh\s*&\s*cn|bo khcn|bo nganh|nafosted/.test(value)) return 'national';
    if (/tinh|thanh pho|cap tinh|cap thanh pho|ubnd tinh|ubnd thanh pho/.test(value)) return 'provincial';

    return 'unknown';
  };

  const explicitLevel = classify(explicit);
  const managementMetadata = normalizeScienceTaskText([
    record.managingAgency,
    record.source,
    record.fundingProgram,
    record.funding_program,
    record.fundingProgramName,
    record.funding_program_name,
    record.programName,
    record.program_name,
    record.program,
    record.programType,
    record.program_type,
    record.projectType,
    record.project_type,
    record.projectTypeName,
    record.project_type_name,
    record.projectCategory,
    record.project_category,
    record.projectName,
    record.project_name,
    record.taskCategory,
    record.task_category,
    record.fundingSourceName,
    record.funding_source_name
  ].filter(value => typeof value === 'string' && value.trim()).join(' '));

  // The rural-mountain program is a separate reporting group even when
  // legacy records also carry a generic local-level value.
  if (explicitLevel === 'rural_mountain' || /du an nong thon mien nui|nong thon mien nui/.test(managementMetadata)) {
    return 'rural_mountain';
  }
  if (explicitLevel !== 'unknown') return explicitLevel;

  // Check higher-level indicators first to prevent a city/provincial record
  // from also falling through into the local-level bucket.
  if (/quoc gia|nha nuoc|cap bo|bo khoa hoc|bo kh\s*&\s*cn|bo khcn|bo nganh|nafosted/.test(managementMetadata)) {
    return 'national';
  }
  if (/cap tinh|cap thanh pho|tinh thanh pho|ubnd tinh|ubnd thanh pho|thanh pho da nang|so khoa hoc va cong nghe|quy phat trien khoa hoc va cong nghe thanh pho|chuong trinh .*thanh pho|de an .*thanh pho/.test(managementMetadata)) {
    return 'provincial';
  }
  if (/du an nong thon mien nui|nong thon mien nui/.test(managementMetadata)) {
    return 'rural_mountain';
  }
  if (/cap co so|cap truong/.test(managementMetadata)) {
    return 'local';
  }

  return 'unknown';
};

export const matchesScienceTaskLevel = (record: BaseEntity, selectedLevel: string): boolean => {
  const level = getScienceTaskLevel(record);
  if (selectedLevel === 'Cấp Bộ' || selectedLevel === 'Cấp Quốc gia' || selectedLevel === 'Cấp Bộ / Ngành' || selectedLevel === 'Cấp Quốc gia / Nhà nước') return level === 'national';
  if (selectedLevel === 'Cấp Tỉnh/Thành phố' || selectedLevel === 'Cấp Thành phố' || selectedLevel === 'Cấp Tỉnh' || selectedLevel === 'Cấp tỉnh/thành phố') return level === 'provincial';
  if (selectedLevel === 'Cấp Cơ sở') return level === 'local';
  if (selectedLevel === 'Dự án nông thôn miền núi') return level === 'rural_mountain';
  if (selectedLevel === 'Chưa phân loại' || selectedLevel === 'Chưa xác định') return level === 'unknown';
  return true;
};

export const getScienceTaskYears = (record: BaseEntity): string[] => {
  const values = [
    record.year,
    record.startYear,
    record.executionYear,
    record.approvalYear,
    record.createdYear,
    record.executionTime,
    record.startDate,
    record.approvalDate
  ];
  const years = new Set<string>();
  values.forEach(value => {
    const matches = String(value ?? '').match(/\b(?:19|20)\d{2}\b/g) || [];
    matches.forEach(year => years.add(year));
  });
  return Array.from(years);
};

export const getScienceTaskYear = (record: BaseEntity): string =>
  getScienceTaskYears(record)[0] || '';

export const getScienceTaskUnits = (record: BaseEntity): string[] =>
  Array.from(new Set([
    record.leadOrganization,
    record.hostOrganization,
    record.ownerName,
    record.proposingOrg,
    record.organization,
    record.managingAgency,
    record.coordinatingOrganization,
    record.workplace
  ].filter(value => typeof value === 'string' && value.trim().length > 0).map(value => String(value).trim())));

export const getScienceTaskUnit = (record: BaseEntity): string =>
  getScienceTaskUnits(record)[0] || '';
