import { useBugComments } from '../model/useBugComments';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';
import { useAuth } from '@/app/providers/AuthContext';
import { MessageSquare } from 'lucide-react';

interface Props {
  bugId: string;
  projectId: string;
}

export const BugCommentSection: React.FC<Props> = ({ bugId, projectId }) => {
  const { user } = useAuth();
  const { comments, loading, createComment, updateComment, deleteComment } = useBugComments(bugId, projectId);

  if (loading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare size={20} />
        Discusión ({Array.isArray(comments) ? comments.length : 0})
      </h3>

      {/* Thread de comentarios */}
      <div className="space-y-4 mb-6">
        {!comments || comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay comentarios aún. Sé el primero en comentar.
          </p>
        ) : (
          Array.isArray(comments) && comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserEmail={user?.email || ''}
              currentUserRole={user?.role || ''}
              onUpdate={updateComment}
              onDelete={deleteComment}
            />
          ))
        )}
      </div>

      {/* Input para nuevo comentario */}
      <CommentInput onSubmit={createComment} />
    </div>
  );
};
