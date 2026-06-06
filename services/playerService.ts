export const calculateMarketValue = (overall: number, position: string): number => {
  const baseValue = overall * 10000;
  let multiplier = 1;
  
  switch (position) {
    case 'ATA': multiplier = 1.5; break;
    case 'MEI': multiplier = 1.3; break;
    case 'ZAG': multiplier = 1.1; break;
    case 'GOL': multiplier = 1.0; break;
    default: multiplier = 1.0;
  }
  
  return Math.round(baseValue * multiplier);
};
