export interface BugComment {
  id: string;
  bug_id: string;
  project_id: string;
  author_email: string;
  author_name: string;
  author_role: 'qa' | 'dev' | 'manager' | 'admin';
  text: string;
  mentions?: string[];
  attachment_path?: string;
  created_date: string;
  updated_date?: string;
  is_deleted: boolean;
}

export interface CreateCommentRequest {
  text: string;
  attachment?: File;
}

export interface UpdateCommentRequest {
  text: string;
}
