import { useState, useRef } from 'react';
import { Upload, Send, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button/Button';

interface Props {
  onSubmit: (text: string, attachment?: File) => Promise<void>;
}

export const CommentInput: React.FC<Props> = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!text.trim() && !attachment) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim(), attachment || undefined);
      setText('');
      setAttachment(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe un comentario... (puedes hacer preguntas, aclaraciones, o documentar hallazgos)"
        className="w-full border-0 bg-transparent resize-none focus:outline-none"
        rows={3}
      />

      {attachment && (
        <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded border">
          <span className="text-sm text-gray-600 flex-1 truncate">{attachment.name}</span>
          <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-3">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-white transition-colors text-sm"
          >
            <Upload size={16} />
            Adjuntar archivo
          </button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={(!text.trim() && !attachment) || isSubmitting}
          variant="primary"
          size="sm"
          leftIcon={<Send size={16} />}
        >
          {isSubmitting ? 'Enviando...' : 'Comentar'}
        </Button>
      </div>
    </div>
  );
};
