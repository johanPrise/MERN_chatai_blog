import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../css/post_him.css';
import { UserContext } from '../UserContext';
import ConfirmationModal from '../components/ConfirmationModal';
import '../css/Link-header.css'
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import '../css/Post.css';
interface Comment {
  _id: string;
  author: {
    username: string;
  };
  content: string;
  createdAt: string;
  likes: string[];
  dislikes: string[];
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
  fetch(`https://mern-backend-neon.vercel.app/comments/${id}`)
    .then(response => response.json())
    .then((fetchedComments: Comment[]) => {
      setComments(fetchedComments);
    })
    .catch(error => console.error('Error fetching comments:', error));
};

const formatContent = (content) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Centrer et arrondir toutes les images
    doc.querySelectorAll('img').forEach(img => {
      img.style.display = 'block';
      img.style.margin = '0 auto';
      img.style.borderRadius = '0.5rem';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    });
  
   // Ajuster l'espacement des titres et paragraphes
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
    heading.style.marginTop = '1.5rem';
    heading.style.marginBottom = '0.5rem';
  });

  doc.querySelectorAll('p').forEach(paragraph => {
    paragraph.style.marginTop = '0.5rem';
    paragraph.style.marginBottom = '1rem';
  });

    return doc.body.innerHTML;
  };

const handleLikeComment = async (commentId: string) => {
  if (!userInfo) {
    alert('You must be logged in to like a comment');
    return;
  }
  try {
    const response = await fetch(`https://mern-backend-neon.vercel.app/comment/${commentId}/like`, {
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
    const response = await fetch(`https://mern-backend-neon.vercel.app/comment/${commentId}/dislike`, {
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
    const response = await fetch(`https://mern-backend-neon.vercel.app/comment/${commentId}`, {
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
      const response = await fetch(`api/comment/${commentId}`, {
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
    const response = await fetch('https://mern-backend-neon.vercel.app/comment', {
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
    try {
      const response = await fetch('https://mern-backend-neon.vercel.app/comment', {
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
        const data = await response.json();
        alert(data.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('An error occurred while posting your comment');
    }
  };

  useEffect(() => {
    fetch(`https://mern-backend-neon.vercel.app/post/${id}`)
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
     const style = document.createElement('style');
    style.textContent = `
      .highlight {
        animation: highlightFade 2s;
      }
      @keyframes highlightFade {
        0% { background-color: #fff3cd; }
        100% { background-color: transparent; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [id, userInfo]);

    const handleLikePost = async () => {
    if (!userInfo) {
      alert('You must be logged in to like a post');
      return;
    }
    try {
      const response = await fetch(`https://mern-backend-neon.vercel.app/post/${id}/like`, {
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
      const response = await fetch(`https://mern-backend-neon.vercel.app/post/${id}/dislike`, {
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
  const scrollToComment = (commentId) => {
  const element = document.getElementById(`comment-${commentId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    element.classList.add('highlight');
    setTimeout(() => {
      element.classList.remove('highlight');
    }, 2000);
  }
};
const renderComments = (comments, depth = 0, parentId = null) => {
  return comments.map((comment) => (
// [MermaidChart: 21eff2e7-b486-4790-8dbc-5b91f59c78c5]
    <div key={comment._id} id={`comment-${comment._id}`} className={`${depth > 0 ? 'ml-8' : ''} bg-white rounded-lg shadow-md p-4 mb-4`}>
      <div className="flex items-start space-x-3 mb-4">
        <img 
          className="w-10 h-10 rounded-full" 
          src={`https://ui-avatars.com/api/?name=${comment.author.username}&background=random`} 
          alt={comment.author.username} 
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{comment.author.username}</h4>
            <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          
          {parentId && (
            <div className="text-xs text-gray-500 mt-1 mb-2">
              replying to <a 
                href={`#comment-${parentId}`} 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToComment(parentId);
                }} 
                className="text-blue-500 hover:underline"
              >
                {comments.find(c => c._id === parentId)?.author.username}
              </a>
            </div>
          )}

          {editingComment === comment._id ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateComment(comment._id);
            }} className="mt-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                required
              />
              <div className="flex justify-end mt-2 space-x-2">
                <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 transition">
                  Update
                </button>
                <button onClick={() => setEditingComment(null)} className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-xs hover:bg-gray-400 transition">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-700 mt-1">{comment.content}</p>
          )}
          
          <div className="flex items-center space-x-4 mt-3">
            <button 
              onClick={() => handleLikeComment(comment._id)} 
              className={`flex items-center space-x-1 text-sm ${comment.likes.includes(userInfo?.id) ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600 transition`}
            >
              <FaThumbsUp />
              <span>{comment.likes.length}</span>
            </button>
            <button 
              onClick={() => handleDislikeComment(comment._id)} 
              className={`flex items-center space-x-1 text-sm ${comment.dislikes.includes(userInfo?.id) ? 'text-red-500' : 'text-gray-500'} hover:text-red-600 transition`}
            >
              <FaThumbsDown />
              <span>{comment.dislikes.length}</span>
            </button>
            <button 
              onClick={() => setReplyingTo(comment._id)} 
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500 transition"
            >
              <span>Reply</span>
            </button>
            {userInfo && userInfo.id === comment.author._id && (
              <>
                <button 
                  onClick={() => handleEditComment(comment._id)} 
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500 transition"
                >
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => handleDeleteComment(comment._id)} 
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-500 transition"
                >
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {replyingTo === comment._id && (
        <form onSubmit={(e) => {
          e.preventDefault();
          handleReply(comment._id, newComment);
          setNewComment('');
          setReplyingTo(null);
        }} className="mt-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your reply..."
            className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <div className="flex justify-end mt-2">
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition">
              Post Reply
            </button>
          </div>
        </form>
      )}
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {renderComments(comment.replies, depth + 1, comment._id)}
        </div>
      )}
    </div>
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
        const response = await fetch(`https://mern-backend-neon.vercel.app/post/${postId}`, {
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
  return `https://mern-backend-neon.vercel.app/${path.replace(/\\/g, '/')}`;
};


  
 return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="relative w-full h-96 bg-cover bg-center rounded-lg overflow-hidden">
          <img src={formatImagePath(postInfo.cover)} alt={postInfo.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center text-white p-4">
            <h1 className="text-4xl font-bold text-center mb-4">{postInfo.title}</h1>
            <time className="text-lg">
              {new Date(postInfo.createdAt).toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </time>
          </div>
        </div>
      </div>

 <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: formatContent(postInfo.content) }}
        />
      </div>

      <div className="flex justify-center items-center space-x-8 mb-8">
        <button onClick={handleLikePost} className={`flex items-center space-x-2 ${userLiked ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600 transition`}>
          <FaThumbsUp className="w-6 h-6" />
          <span className="text-lg">{likes}</span>
        </button>
        <button onClick={handleDislikePost} className={`flex items-center space-x-2 ${userDisliked ? 'text-red-500' : 'text-gray-500'} hover:text-red-600 transition`}>
          <FaThumbsDown className="w-6 h-6" />
          <span className="text-lg">{dislikes}</span>
        </button>
      </div>

      {id2 === postInfo.author && (
        <div className="flex justify-center space-x-4 mb-8">
          <Link to={`/edit_page/${postInfo._id}`} className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition">
            Edit Post
          </Link>
          <button onClick={() => deletePost(postInfo._id)} className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition">
            Delete Post
          </button>
        </div>
      )}

      <div className="bg-gray-100 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Discussion ({comments.length})</h2>
        
        {username ? (
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <textarea 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            ></textarea>
            <button 
              type="submit"
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition"
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p className="mb-6 text-gray-600">Please <Link to="/login_page" className="text-blue-500 hover:underline">log in</Link> to comment and like.</p>
        )}

        <div className="space-y-6">
          {renderComments(comments)}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={confirmModalIsOpen} 
        onRequestClose={() => setConfirmModalIsOpen(false)} 
        onConfirm={confirmModalOnConfirm} 
      />
    </div>
  );
};



export default PostPage;
