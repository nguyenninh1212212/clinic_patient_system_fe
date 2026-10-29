import * as MuiIcons from '@mui/icons-material';
import { SvgIconComponent } from '@mui/icons-material';

export const renderMaterialIcon = (
  iconName?: string,
  fontSize: 'small' | 'medium' | 'inherit' = 'small',
) => {
  if (!iconName || !(iconName in MuiIcons)) return null;

  const IconComp = (
    MuiIcons as Record<string, SvgIconComponent>
  )[iconName];

  return <IconComp fontSize={fontSize} />;
};