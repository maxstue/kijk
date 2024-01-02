import { memo, useEffect } from 'react';

interface Props {
  title?: string;
}

export const Head = memo(function Head({ title }: Props) {
  useEffect(() => {
    document.title = title ? `${title} | Kijk` : 'Kijk';
  }, [title]);

  return null;
});
