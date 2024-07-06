import React, {useState, useEffect} from "react";
import "../css/Post.css";
import { Link } from "react-router-dom";
// Importation de la fonction formatISO9075
import { formatISO9075 } from "date-fns";
// Importation de la fonction htmlToText
import { htmlToText } from "html-to-text";
type PostType = {
  _id: string;
  title: string;
  summary: string;
  cover: string;
  author: { username: string };
  createdAt: string | Date;
  content: string;
  category: { // Ajout du champ category
    _id: string;
    name: string;
    description?:string
  };
};


/**
 * Renders an author badge component with the given author name.
 *
 * @param {string} author - The name of the author to display in the badge.
 * @return {JSX.Element} A React component representing the author badge.
 */
const AuthorBadge = ({ author }) => {
  return (
    <div className="inline-flex items-center px-2 py-1 rounded-full bg-gray-200 text-gray-700 text-xs transition-all duration-300 ease-out hover:bg-green-500 hover:text-white hover:scale-105">
      {author}
    </div>
  );
};

/**
 * Renders a post component with the given post data.
 *
 * @param {PostType} post - The post data to render.
 * @return {JSX.Element} A React component representing the post.
 */
export default function Post({ post }: { post: PostType }) {
  const { _id, title, summary, cover, author, createdAt, content, category } = post;

  // Convert HTML content to plain text
  const plainTextContent = htmlToText(content, {
    wordwrap: 130,
    limits: { maxInputLength: 500 },
  });

  return (
    <article className="overflow-hidden rounded-lg shadow transition hover:shadow-lg">
<img
  alt=""
  src={cover.startsWith('http') ? cover : `https://mern-backend-neon.vercel.app/${cover}`}
  className="h-56 w-full object-cover"
/>

      <div className="bg-white p-4 sm:p-6">
        <time dateTime={formatISO9075(new Date(createdAt))} className="block text-xs text-gray-500">
          {new Date(createdAt).toLocaleString("default", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>

        <Link to={`/Post/${_id}`}>
          <h3 className="mt-0.5 text-lg text-gray-900">{title}</h3>
        </Link>

        <p className="mt-2 line-clamp-3 text-sm/relaxed text-gray-500">
          {summary}
        </p>

        <div className="mt-2 flex items-center">
          <AuthorBadge author={author.username} />
        </div>
      </div>
    </article>
  );
}
export type { PostType };
