// Fichier ES6 TSX
import React, { useRef, useState, useEffect } from 'react';

interface AnimateOnViewProps {
  children: React.ReactNode;
}

/**
 * Function that animates the children when they come into view.
 *
 * @param {AnimateOnViewProps} children - The children components to animate.
 * @return {JSX.Element} The animated component.
 */
const AnimateOnView: React.FC<AnimateOnViewProps> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-transform duration-500 ${
        inView ? 'animate-slideDown' : '-translate-y-10 opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

export default AnimateOnView;