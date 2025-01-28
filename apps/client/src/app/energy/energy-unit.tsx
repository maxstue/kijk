import { EnergyType, EnergyTypes } from '@/shared/types/app';

interface Props {
  type: EnergyType;
}

export default function EnergyUnit({ type }: Props) {
  return type === EnergyTypes.ELECTRICITY ? (
    <span className='text-md font-normal text-muted-foreground'>kWh</span>
  ) : (
    <span className='text-md font-normal text-muted-foreground'>
      m<sup>3</sup>
    </span>
  );
}
