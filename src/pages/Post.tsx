import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../css/post_him.css';
import { UserContext } from '../UserContext';
import ConfirmationModal from '../components/ConfirmationModal';
import '../css/Link-header.css';

/**
 * Asynchronously deletes a post.
 *
 * @param {any} postId - The ID of the post to delete.
 * @return {Promise<void>} A promise that resolves after deleting the post.
 */
const PostPage = () => {
  const [postInfo, setPostInfo] = useState(null);
  const [confirmModalIsOpen, setConfirmModalIsOpen] = useState(false);
  const [confirmModalOnConfirm, setConfirmModalOnConfirm] = useState(() => () => {});
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();

  useEffect(() => {
    fetch(`/api/post/${id}`)
      .then(response => response.json())
      .then(postInfo => {
        setPostInfo(postInfo);
      })
      .catch(error => console.error('Error fetching post:', error));
  }, [id]);

  if (!postInfo) return '';

  const username = userInfo?.username;
  const id2 = userInfo?.id;

  /**
   * Asynchronously deletes a post.
   *
   * @param {any} postId - The ID of the post to delete.
   * @return {Promise<void>} A promise that resolves after deleting the post.
   */
  async function deletePost(postId) {
    try {
      // Afficher la fenêtre modale de confirmation
      setConfirmModalIsOpen(true);
      const confirmDeletion = await new Promise(resolve => {
        setConfirmModalOnConfirm(() => {
          resolve(true);
          setConfirmModalIsOpen(false);
        });
      });

      if (confirmDeletion) {
        const response = await fetch(`/api/post/${postId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          // Gérer la suppression réussie
          console.log('Post deleted successfully');
          alert("Post deleted successfully");
          // Rediriger vers la page d'accueil ou une autre page
          window.location.href = '/';
        } else {
          // Gérer l'erreur
          console.error('Error deleting post');
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
const formatImagePath = (path) => {
  // Remplacer toutes les barres obliques inversées par des barres obliques normales
  return path.replace(/\\/g, '/');
};
  return (
    <div className="post_himself justify-between mx-auto grid text-center">
      <div className="relative w-full h-96 bg-cover mb-2 bg-center" style={{ backgroundImage: `url(${formatImagePath(`/../../api/${postInfo.cover}`)})`, marginTop: '-2rem' }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-white p-4">
          <h1 className="text-4xl font-bold">{postInfo.title}</h1>
          <time className="text-lg mt-2">
            {new Date(postInfo.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </time>
        </div>
      </div>
      <div className="post-content grid justify-center items-center p-8">
        <div dangerouslySetInnerHTML={{ __html: postInfo.content }} />
      </div>
      {id2 === postInfo.author && (
        <div className="edit-row flex justify-center transition ease-in-out rounded p-3 m-2">
          <Link className="button-class flex items-center bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md" to={`/edit_page/${postInfo._id}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <p>Edit the post</p>
          </Link>
          <button className="button-class_2 flex items-center bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-md ml-4" onClick={() => deletePost(postInfo._id)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p>Delete Post</p>
          </button>
          <ConfirmationModal isOpen={confirmModalIsOpen} onRequestClose={() => setConfirmModalIsOpen(false)} onConfirm={confirmModalOnConfirm} />
        </div>
      )}
    </div>
  );
};

export default PostPage;
