import { useEffect } from 'react';

/**
 * Custom hook to dynamically update document title
 * @param {string} title
 */
export const usePageTitle = (title) => {
  useEffect(() => {
    const base = 'Manisha Electronics';
    if (title) {
      document.title = `${title} | ${base}`;
    } else {
      document.title = base;
    }
  }, [title]);
};

export default usePageTitle;
