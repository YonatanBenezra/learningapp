export const APP_NAME = 'LabPath';
export const APP_NAME_MARK = 'Lab';
export const APP_NAME_REST = 'Path';
export const APP_TAGLINE = 'Learn, Lab, Level up';
export const APP_METADATA_TITLE = `${APP_NAME} — ${APP_TAGLINE}`;

export function pageTitle(section: string): string {
  return `${section} | ${APP_NAME}`;
}
