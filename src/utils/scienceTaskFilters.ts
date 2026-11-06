import type { BaseEntity } from '../types';

export type ScienceTaskLevel = 'national' | 'provincial' | 'local' | 'unknown';

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

    if (/cap co so|cap truong|co so/.test(value)) return 'local';
    if (/quoc gia|nha nuoc|cap bo|bo khoa hoc|bo nganh|nafosted/.test(value)) return 'national';
    if (/tinh|thanh pho|cap tinh|cap thanh pho|ubnd tinh|ubnd thanh pho/.test(value)) return 'provincial';

    return 'unknown';
  };

  const explicitLevel = classify(explicit);
  if (explicitLevel !== 'unknown') return explicitLevel;

  const managementMetadata = normalizeScienceTaskText([
    record.managingAgency,
    record.source,
    record.fundingProgram,
    record.programName,
    record.program,
    record.projectType
  ].filter(value => typeof value === 'string' && value.trim()).join(' '));

  // Check higher-level indicators first to prevent a city/provincial record
  // from also falling through into the local-level bucket.
  if (/quoc gia|nha nuoc|cap bo|bo khoa hoc|bo nganh|nafosted/.test(managementMetadata)) {
    return 'national';
  }
  if (/cap tinh|cap thanh pho|tinh thanh pho|ubnd tinh|ubnd thanh pho|thanh pho da nang|so khoa hoc va cong nghe|quy phat trien khoa hoc va cong nghe thanh pho|chuong trinh .*thanh pho|de an .*thanh pho/.test(managementMetadata)) {
    return 'provincial';
  }
  if (/cap co so|cap truong/.test(managementMetadata)) {
    return 'local';
  }

  return 'unknown';
};

export const matchesScienceTaskLevel = (record: BaseEntity, selectedLevel: string): boolean => {
  const level = getScienceTaskLevel(record);
  if (selectedLevel === 'Cấp Bộ' || selectedLevel === 'Cấp Quốc gia') return level === 'national';
  if (selectedLevel === 'Cấp Thành phố') return level === 'provincial';
  if (selectedLevel === 'Cấp Cơ sở') return level === 'local';
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
