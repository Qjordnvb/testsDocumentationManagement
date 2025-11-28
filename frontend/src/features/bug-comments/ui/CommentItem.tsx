import { useState } from 'react';
import type { BugComment } from '@/entities/bug-comment/model/types';
import { Edit2, Trash2, Paperclip } from 'lucide-react';

interface Props {
  comment: BugComment;
  currentUserEmail: string;
  currentUserRole: string;
  onUpdate: (commentId: string, text: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

const getTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'ahora mismo';
  if (diffMins < 60) return `hace ${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `hace ${diffDays}d`;

  return date.toLocaleDateString('es-ES');
};

export const CommentItem: React.FC<Props> = ({
  comment,
  currentUserEmail,
  currentUserRole,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const isAuthor = comment.author_email === currentUserEmail;
  const canDelete = isAuthor || currentUserRole === 'admin';

  const handleSaveEdit = async () => {
    if (editText.trim() !== comment.text) {
      await onUpdate(comment.id, editText.trim());
    }
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'qa': return 'bg-blue-100 text-blue-700';
      case 'dev': return 'bg-green-100 text-green-700';
      case 'manager': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${getRoleColor(comment.author_role)}`}>
        {comment.author_name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{comment.author_name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(comment.author_role)}`}>
            {comment.author_role.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            {getTimeAgo(comment.created_date)}
          </span>

          {/* Actions */}
          <div className="ml-auto flex gap-2">
            {isAuthor && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-600">
                <Edit2 size={14} />
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(comment.id)} className="text-gray-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Text */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                Guardar
              </button>
              <button onClick={() => setIsEditing(false)} className="px-3 py-1 border rounded text-sm">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap break-words">{comment.text}</p>
        )}

        {/* Attachment */}
        {comment.attachment_path && (
          <div className="mt-2">
            {/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(comment.attachment_path) ? (
              <div className="max-w-md">
                <img
                  src={`/api/v1/evidence/${comment.attachment_path}`}
                  alt="attachment"
                  className="w-full rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.open(`/api/v1/evidence/${comment.attachment_path}`, '_blank')}
                  onError={(e) => {
                    console.error('Failed to load image:', comment.attachment_path);
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    const filename = comment.attachment_path?.split('/').pop() || 'archivo';
                    if (parent) {
                      parent.innerHTML = `
                        <a href="/api/v1/evidence/${comment.attachment_path}"
                           target="_blank"
                           class="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                          </svg>
                          ${filename} (Error al cargar imagen)
                        </a>
                      `;
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {comment.attachment_path.split('/').pop()}
                </p>
              </div>
            ) : (
              <a
                href={`/api/v1/evidence/${comment.attachment_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-sm transition-colors"
              >
                {/\.pdf$/i.test(comment.attachment_path) ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                ) : /\.(doc|docx)$/i.test(comment.attachment_path) ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                ) : (
                  <Paperclip size={16} />
                )}
                <span className="text-gray-700 font-medium truncate max-w-xs">
                  {comment.attachment_path.split('/').pop()}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
          </div>
        )}

        {comment.updated_date && (
          <p className="text-xs text-gray-400 mt-1">(editado)</p>
        )}
      </div>
    </div>
  );
};
