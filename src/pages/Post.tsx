import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../css/post_him.css';
import { UserContext } from '../UserContext';
import ConfirmationModal from '../components/ConfirmationModal';
import '../css/Link-header.css'
import { FaThumbsDown,FaThumbsUp}  from 'react-icons/fa';
interface Comment {
  _id: string;
  author: {
    username: string;
  };
  content: string;
  createdAt: string;
  likes: string[];
}

/**
 * Asynchronously deletes a post.
 *
 * @param {any} postId - The ID of the post to delete.
 * @return {Promise<void>} A promise that resolves after deleting the post.
 */
const PostPage = () => {
  const [postInfo, setPostInfo] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [confirmModalIsOpen, setConfirmModalIsOpen] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [confirmModalOnConfirm, setConfirmModalOnConfirm] = useState(() => () => {});
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();

const fetchComments = () => {
  fetch(`/api/comments/${id}`)
    .then(response => response.json())
    .then((fetchedComments: Comment[]) => {
      setComments(fetchedComments);
    })
    .catch(error => console.error('Error fetching comments:', error));
};


const handleLikeComment = async (commentId: string) => {
  if (!userInfo) {
    alert('You must be logged in to like a comment');
    return;
  }
  try {
    const response = await fetch(`/api/comment/${commentId}/like`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      setComments(comments.map(comment => 
        comment._id === commentId 
          ? {...comment, likes: data.likes, dislikes: data.dislikes} 
          : comment
      ));
    }
  } catch (error) {
    console.error('Error liking comment:', error);
  }
};

const handleDislikeComment = async (commentId: string) => {
  if (!userInfo) {
    alert('You must be logged in to dislike a comment');
    return;
  }
  try {
    const response = await fetch(`/api/comment/${commentId}/dislike`, {
      method: 'POST',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      setComments(comments.map(comment => 
        comment._id === commentId 
          ? {...comment, likes: data.likes, dislikes: data.dislikes} 
          : comment
      ));
    }
  } catch (error) {
    console.error('Error disliking comment:', error);
  }
};
  const handleEditComment = (commentId) => {
  const comment = comments.find(c => c._id === commentId);
  setEditingComment(commentId);
  setEditedContent(comment.content);
  setOpenDropdown(null);
};

const handleUpdateComment = async (commentId) => {
  try {
    const response = await fetch(`/api/comment/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: editedContent }),
      credentials: 'include',
    });
    if (response.ok) {
      fetchComments();
      setEditingComment(null);
    } else {
      alert('Failed to update comment');
    }
  } catch (error) {
    console.error('Error updating comment:', error);
  }
};

const handleDeleteComment = async (commentId) => {
  if (window.confirm('Are you sure you want to delete this comment?')) {
    try {
      const response = await fetch(`/api/comment/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        fetchComments();
      } else {
        alert('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }
  setOpenDropdown(null);
};
const handleReply = async (parentId, content) => {
  if (!userInfo) {
    alert('You must be logged in to reply');
    return;
  }
  try {
    const response = await fetch('/api/comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        postId: id,
        parentId,
      }),
      credentials: 'include',
    });
    if (response.ok) {
      fetchComments();
    } else {
      alert('Failed to post reply');
    }
  } catch (error) {
    console.error('Error posting reply:', error);
  }
};
const handleCommentSubmit = async (e, parentId = null) => {
    e.preventDefault();
    if (!userInfo) {
      alert('You must be logged in to comment');
      return;
    }
    try {
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          postId: id,
          parentId,
        }),
        credentials: 'include',
      });
      if (response.ok) {
        setNewComment('');
        setReplyingTo(null);
        fetchComments();
      } else {
        alert('Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  useEffect(() => {
    fetch(`/api/post/${id}`)
      .then(response => response.json())
      .then(postInfo => {
        setPostInfo(postInfo);
        setLikes(postInfo.likes?.length || 0);
        setDislikes(postInfo.dislikes?.length || 0);
        if (userInfo) {
          setUserLiked(postInfo.likes?.includes(userInfo.id));
          setUserDisliked(postInfo.dislikes?.includes(userInfo.id));
        }
      })
      .catch(error => console.error('Error fetching post:', error));

    fetchComments();
  }, [id, userInfo]);

    const handleLikePost = async () => {
    if (!userInfo) {
      alert('You must be logged in to like a post');
      return;
    }
    try {
      const response = await fetch(`/api/post/${id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes.length);
        setDislikes(data.dislikes.length);
        setUserLiked(data.likes.includes(userInfo.id));
        setUserDisliked(data.dislikes.includes(userInfo.id));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleDislikePost = async () => {
    if (!userInfo) {
      alert('You must be logged in to dislike a post');
      return;
    }
    try {
      const response = await fetch(`/api/post/${id}/dislike`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes.length);
        setDislikes(data.dislikes.length);
        setUserLiked(data.likes.includes(userInfo.id));
        setUserDisliked(data.dislikes.includes(userInfo.id));
      }
    } catch (error) {
      console.error('Error disliking post:', error);
    }
  };
  const renderComments = (comments, depth = 0) => {
  return comments.map((comment) => (
    <article key={comment._id} className={`p-4 mb-2 text-sm rounded-lg ${depth === 0 ? 'border border-green-300' : ''}`}>
      <footer className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <p className="inline-flex items-center mr-3 text-sm text-gray-900 font-semibold">
            <img className="mr-2 w-5 h-5 rounded-full" src={`https://ui-avatars.com/api/?name=${comment.author.username}`} alt={comment.author.username} />
            {comment.author.username}
          </p>
          <p className="text-xs text-gray-600">
            <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time>
          </p>
        </div>
      </footer>
      <div className="pl-2">
        {editingComment === comment._id ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleUpdateComment(comment._id);
          }}>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              required
            />
            <div className="flex mt-2">
              <button type="submit" className="text-xs bg-green-500 text-white px-2 py-1 rounded mr-2">
                Update
              </button>
              <button onClick={() => setEditingComment(null)} className="text-xs bg-gray-500 text-white px-2 py-1 rounded">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-gray-700 mb-2">{comment.content}</p>
            <div className="flex items-center space-x-2 text-xs">
<button 
    onClick={() => handleLikeComment(comment._id)} 
    className={`flex items-center ${comment.likes.includes(userInfo?.id) ? 'text-blue-500' : 'text-gray-500'}`}
  >
    <LikeIcon />
    <span>{comment.likes.length}</span>
  </button>
  <button 
    onClick={() => handleDislikeComment(comment._id)} 
    className={`flex items-center ${comment.dislikes.includes(userInfo?.id) ? 'text-red-500' : 'text-gray-500'}`}
  >
    <DislikeIcon />
    <span>{comment.dislikes.length}</span>
  </button>
              <button type="button" onClick={() => setReplyingTo(comment._id)} className="text-gray-500 hover:underline">
                Reply
              </button>
              {userInfo && userInfo.id === comment.author._id && (
                <>
                  <button onClick={() => {
                    setEditingComment(comment._id);
                    setEditedContent(comment.content);
                  }} className="text-blue-500 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteComment(comment._id)} className="text-red-500 hover:underline">
                    Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
        {replyingTo === comment._id && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleReply(comment._id, newComment);
            setNewComment('');
            setReplyingTo(null);
          }} className="mt-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-2 border rounded text-sm"
              required
            />
            <button type="submit" className="mt-1 text-xs bg-green-500 text-white px-2 py-1 rounded">
              Post Reply
            </button>
          </form>
        )}
        {comment.replies && (
          <div className="mt-2 pl-4 border-l-2 border-gray-200">
            {renderComments(comment.replies, depth + 1)}
          </div>
        )}
      </div>
    </article>
  ));
};

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

  const LikeIcon = () => (
    <div className="svg-snoweb svg-theme-light">
      <FaThumbsUp/>
    </div>
  );

  const DislikeIcon = () => (
    <div className="svg-snoweb svg-theme-light ">
      <FaThumbsDown/>

    </div>
  );

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
            <div className="flex items-center justify-center mt-4">
        <button onClick={handleLikePost} className={`flex items-center mr-4 ${userLiked ? 'text-blue-500' : 'text-gray-500'}`}>
          <div className="w-5 h-5 mr-1">
            <LikeIcon/>
          </div>
          <span>{likes}</span>
        </button>
        <button onClick={handleDislikePost} className={`flex items-center ${userDisliked ? 'text-red-500' : 'text-gray-500'}`}>
          <div className="w-5 h-5 mr-1">
            <DislikeIcon/>
          </div>
          <span>{dislikes}</span>
        </button>
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
 <section className="bg-white dark:bg-gray-900 py-8 lg:py-16 antialiased">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">Discussion ({comments.length})</h2>
          </div>
          <form className="mb-6" onSubmit={handleCommentSubmit}>
            <div className="py-2 px-4 mb-4 bg-white rounded-lg rounded-t-lg border-2 border-green-500">
              <label htmlFor="comment" className="sr-only">Your comment</label>
              <textarea 
                id="comment" 
                rows="6"
                className="px-0 w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              ></textarea>
            </div>
            <button 
              type="submit"
              className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-green-500 rounded-lg focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-green-600"
            >
              Post comment
            </button>
          </form>
          {renderComments(comments)}
        </div>
      </section>
    </div>
  );
};

export default PostPage;
