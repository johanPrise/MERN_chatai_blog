// src/components/Featured.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import Button from './button';
import { PostType } from '../components/Post';

interface FeaturedProps {
  featured: PostType | null;
}

/**
 * Renders a featured post with an image, title, author, date, summary, and a link to the full post.
 *
 * @param {FeaturedProps} props - The props for the Featured component.
 * @param {PostType | null} props.featured - The featured post to render.
 * @return {JSX.Element | null} The rendered Featured component or null if featured is null.
 */
const Featured: React.FC<FeaturedProps> = ({ featured }) => {
  if (!featured) return null; // Ne rien rendre si featured est null

  const { _id, title, summary, cover, author, createdAt } = featured;

  return (
    <div className="flex flex-col md:flex-row md:items-center">
      <div className="md:w-1/2 md:pr-8">
        <img src={`https://mern-backend-neon.vercel.app/${cover}`} alt={title} className="w-full md:h-96 object-cover rounded-lg" />
      </div>
      <div className="mt-4 md:mt-0 md:w-1/2">
        <h3 className="text-gray-800 font-semibold mb-2">FEATURED POST</h3>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600 mb-4">
          By <span>{author.username}</span> | {new Date(createdAt).toLocaleDateString()}
        </p>
        <p className="text-gray-700 mb-6">{summary}</p>
        <Link to={`/Post/${_id}`}>
          <Button text="Read More" />
        </Link>
      </div>
    </div>
  );
};

export default Featured;
