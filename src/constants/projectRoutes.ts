export const PROJECT_WIZARD_ROUTE = '/projects/wizard';

export const createProjectWizardRoute = () =>
  `${PROJECT_WIZARD_ROUTE}?new=${Date.now()}`;
