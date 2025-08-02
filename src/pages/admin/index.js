import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Layout from '../../components/layout';

const GITHUB_TOKEN = process.env.GATSBY_GITHUB_TOKEN;
const REPO_OWNER = process.env.GATSBY_REPO_OWNER;
const REPO_NAME = process.env.GATSBY_REPO_NAME;
const BRANCH_NAME = process.env.GATSBY_BRANCH_NAME;

const GitHubApiHeaders = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

const makeGitHubRequest = async (url, method = 'GET', data = null) => {
  const options = {
    method,
    headers: GitHubApiHeaders,
  };
  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(
      `GitHub API Error: ${response.status} - ${errorData.message || 'Unknown error'}`,
    );
  }
  return response.json();
};

const getFileContent = async (path, sha) => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs/${sha}`;
  const data = await makeGitHubRequest(url);
  return new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
};

const getRepoContents = async (path = '') => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH_NAME}`;
  return makeGitHubRequest(url);
};

const createOrUpdateFile = async (path, content, message, sha = null) => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const encodedContent = btoa(unescape(encodeURIComponent(content)));
  const data = {
    message: message,
    content: encodedContent,
    branch: BRANCH_NAME,
    sha: sha,
  };
  return makeGitHubRequest(url, 'PUT', data);
};

const deleteFile = async (path, message, sha) => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const data = {
    message: message,
    branch: BRANCH_NAME,
    sha: sha,
  };
  return makeGitHubRequest(url, 'DELETE', data);
};

const uploadImageToGitHub = async (fileName, base64Content, message, existingSha = null) => {
  const imagePath = `static/images/uploads/${fileName}`;
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${imagePath}`;
  const data = {
    message: message,
    content: base64Content,
    branch: BRANCH_NAME,
    sha: existingSha,
  };
  return makeGitHubRequest(url, 'PUT', data);
};

const StyledAdminContainer = styled.main`
  padding: var(--nav-height) 0;
  max-width: 900px;
  margin: 0 auto;
  min-height: calc(100vh - var(--nav-height) - 50px);

  h1 {
    font-size: var(--fz-heading);
    color: var(--lightest-slate);
    margin-bottom: 20px;
    text-align: center;
  }

  .section-title {
    margin-top: 50px;
    margin-bottom: 30px;
    font-size: var(--fz-xl);
    color: var(--green);
    border-bottom: 1px solid var(--light-navy);
    padding-bottom: 10px;
  }

  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      font-size: var(--fz-md);
      color: var(--light-slate);
      margin-bottom: 8px;
    }

    input[type='text'],
    input[type='datetime-local'],
    input[type='date'],
    textarea,
    select {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--light-navy);
      border-radius: var(--border-radius);
      background-color: var(--navy);
      color: var(--lightest-slate);
      font-family: var(--font-mono);
      font-size: var(--fz-md);
      &:focus {
        outline: 1px solid var(--green);
      }
    }

    input[type='file'] {
      width: 100%;
      padding: 10px 0;
      color: var(--light-slate);
      font-family: var(--font-mono);
      font-size: var(--fz-md);
    }

    textarea {
      min-height: 200px;
      resize: vertical;
    }
  }

  .button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;

    button {
      ${({ theme }) => theme.mixins.smallButton};
      margin: 0;
    }
  }

  .post-list {
    margin-top: 40px;
    list-style: none;
    padding: 0;

    li {
      background-color: var(--light-navy);
      padding: 15px 20px;
      margin-bottom: 10px;
      border-radius: var(--border-radius);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;

      .post-info {
        flex-grow: 1;
        h3 {
          color: var(--lightest-slate);
          font-size: var(--fz-lg);
          margin: 0 0 5px 0;
        }
        p {
          color: var(--slate);
          font-size: var(--fz-sm);
          margin: 0;
        }
      }

      .post-actions {
        display: flex;
        gap: 10px;

        button {
          margin: 0;
          ${({ theme }) => theme.mixins.smallButton};
          padding: 8px 12px;
          font-size: var(--fz-xs);
        }
      }
    }
  }

  .status-message {
    margin-top: 20px;
    padding: 10px;
    border-radius: var(--border-radius);
    background-color: var(--light-navy);
    color: var(--green);
    font-size: var(--fz-md);
    text-align: center;
  }
`;

const AdminPage = ({ location }) => {
  const [formData, setFormData] = useState({
    type: 'posts',
    title: '',
    date: new Date().toISOString().slice(0, 16),
    description: '',
    tags: '',
    body: '',
    imageFile: null,
    imageUrl: '',
    github: '',
    external: '',
    tech: '',
    company: '',
    range: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [editingPost, setEditingPost] = useState(null);

  const loggedIn = true;

  const fetchContent = async () => {
    setLoading(true);
    setStatusMessage('Đang tải nội dung...');
    try {
      const allContent = [];
      const pathsToFetch = [
        'content/posts',
        'content/projects',
        'content/featured',
        'content/jobs',
      ];

      for (const contentPath of pathsToFetch) {
        try {
          const files = await getRepoContents(contentPath);
          for (const file of files) {
            if (file.type === 'file' && file.name.endsWith('.md')) {
              const fileData = await getFileContent(file.path, file.sha);
              const parts = fileData.split('---');
              let frontmatter = {};
              let bodyContent = '';
              if (parts.length > 2) {
                try {
                  const fmBlock = parts[1];
                  frontmatter = parseFrontmatter(fmBlock);
                } catch (e) {
                  console.warn(`Could not parse frontmatter for ${file.path}:`, e);
                }
                bodyContent = parts.slice(2).join('---').trim();
              } else {
                bodyContent = fileData.trim();
              }

              allContent.push({
                path: file.path,
                name: file.name,
                sha: file.sha,
                frontmatter: frontmatter,
                body: bodyContent,
                type: contentPath.split('/')[1],
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching content from ${contentPath}:`, error);
          setStatusMessage(
            `Lỗi khi tải nội dung từ ${contentPath}: ${error.message}. Vui lòng đảm bảo PAT chính xác.`,
          );
          return;
        }
      }
      setPosts(allContent);
      setStatusMessage('Tải nội dung thành công.');
    } catch (error) {
      console.error('Error fetching all content:', error);
      setStatusMessage(
        `Lỗi khi tải nội dung tổng thể: ${error.message}. Vui lòng đảm bảo PAT chính xác.`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
      }));
    }
  };

  const handleTypeChange = e => {
    setFormData({
      ...formData,
      type: e.target.value,
      title: '',
      date: new Date().toISOString().slice(0, 16),
      description: '',
      tags: '',
      body: '',
      imageFile: null,
      imageUrl: '',
      github: '',
      external: '',
      tech: '',
      company: '',
      range: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
    });
    setEditingPost(null);
  };

  const parseFrontmatter = fmString => {
    const lines = fmString
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const fm = {};
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        let key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value
            .substring(1, value.length - 1)
            .split(',')
            .map(item => item.trim());
        } else if (value.toLowerCase() === 'true') {
          value = true;
        } else if (value.toLowerCase() === 'false') {
          value = false;
        } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
          value = parseFloat(value);
        } else if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith('`') && value.endsWith('`')) {
          value = value.substring(1, value.length - 1);
        }
        fm[key] = value;
      }
    });
    return fm;
  };

  const stringifyFrontmatter = fmObject => {
    let fmString = '';
    for (const key in fmObject) {
      if (Object.prototype.hasOwnProperty.call(fmObject, key)) {
        let value = fmObject[key];
        if (Array.isArray(value)) {
          value = `[${value
            .map(item => (typeof item === 'string' ? `'${item}'` : item))
            .join(', ')}]`;
        } else if (
          typeof value === 'string' &&
          (value.includes(':') || value.includes(' ') || value.includes('/') || value.includes('.'))
        ) {
          value = `"${value}"`;
        }
        fmString += `${key}: ${value}
`;
      }
    }
    return `---
${fmString}---`;
  };

  const generateMarkdownContent = data => {
    const frontmatter = {};
    let fileName = '';
    let filePath = '';

    switch (data.type) {
      case 'posts':
        frontmatter.title = data.title;
        frontmatter.date = data.date;
        frontmatter.description = data.description;
        if (data.tags) frontmatter.tags = data.tags.split(',').map(tag => tag.trim());
        if (data.imageUrl) frontmatter.image = data.imageUrl;

        fileName = `${new Date(data.date).toISOString().slice(0, 10)}-${data.title
          .toLowerCase()
          .replace(/\s/g, '-')}.md`;
        filePath = `content/posts/${data.title.toLowerCase().replace(/\s/g, '-')}/index.md`;
        break;
      case 'projects':
        frontmatter.title = data.title;
        frontmatter.description = data.description;
        if (data.github) frontmatter.github = data.github;
        if (data.external) frontmatter.external = data.external;
        if (data.tech) frontmatter.tech = data.tech.split(',').map(tech => tech.trim());
        frontmatter.date = data.date;
        fileName = `${data.title.toLowerCase().replace(/\s/g, '-')}.md`;
        filePath = `content/projects/${fileName}`;
        break;
      case 'featured':
        frontmatter.title = data.title;
        frontmatter.description = data.description;
        if (data.github) frontmatter.github = data.github;
        if (data.external) frontmatter.external = data.external;
        if (data.tech) frontmatter.tech = data.tech.split(',').map(tech => tech.trim());
        if (data.imageUrl) frontmatter.image = data.imageUrl;

        fileName = `${data.title.toLowerCase().replace(/\s/g, '-')}/index.md`;
        filePath = `content/featured/${fileName}`;
        break;
      case 'jobs':
        frontmatter.title = data.title;
        frontmatter.company = data.company;
        if (data.range) frontmatter.range = data.range;
        frontmatter.startDate = data.startDate;
        if (data.endDate) frontmatter.endDate = data.endDate;
        fileName = `${data.company.toLowerCase().replace(/\s/g, '-')}.md`;
        filePath = `content/jobs/${fileName}`;
        break;
      default:
        return { content: '', path: '' };
    }

    const frontmatterString = stringifyFrontmatter(frontmatter);
    const markdownContent = `${frontmatterString}

${data.body}`;
    return { content: markdownContent, path: filePath };
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('');

    let uploadedImageUrl = formData.imageUrl;
    let imageSha = null;

    try {
      if (formData.imageFile) {
        setStatusMessage('Đang tải ảnh lên...');
        const reader = new FileReader();
        reader.readAsDataURL(formData.imageFile);
        await new Promise((resolve, reject) => {
          reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];
            const imageFileName = formData.imageFile.name;
            const uploadCommitMessage = `feat(upload): Upload image ${imageFileName}`;

            try {
              if (editingPost && editingPost.frontmatter.image) {
                const existingImagePath = editingPost.frontmatter.image.startsWith('/')
                  ? editingPost.frontmatter.image.substring(1)
                  : editingPost.frontmatter.image;
                try {
                  const existingImageContent = await getRepoContents(existingImagePath);
                  imageSha = existingImageContent.sha;
                } catch (imgError) {
                  console.warn('Could not find existing image SHA, creating new one.', imgError);
                  imageSha = null;
                }
              }

              const uploadResult = await uploadImageToGitHub(
                imageFileName,
                base64Image,
                uploadCommitMessage,
                imageSha,
              );
              uploadedImageUrl = uploadResult.content.path;
              setStatusMessage(`Tải ảnh "${imageFileName}" thành công.`);
              resolve();
            } catch (imgUploadError) {
              console.error('Error uploading image:', imgUploadError);
              setStatusMessage(`Lỗi khi tải ảnh lên: ${imgUploadError.message}`);
              reject(imgUploadError);
            }
          };
          reader.onerror = error => reject(error);
        });
      }

      const contentDataForMarkdown = { ...formData, imageUrl: uploadedImageUrl };
      const { content, path } = generateMarkdownContent(contentDataForMarkdown);

      if (!path) {
        setStatusMessage('Lỗi: Không thể tạo đường dẫn tệp cho loại nội dung này.');
        setLoading(false);
        return;
      }

      const commitMessage = editingPost
        ? `feat(${formData.type}): Update ${formData.title}`
        : `feat(${formData.type}): New ${formData.title}`;

      if (editingPost) {
        await createOrUpdateFile(path, content, commitMessage, editingPost.sha);
        setStatusMessage(`Cập nhật "${formData.title}" thành công!`);
        setEditingPost(null);
      } else {
        if (formData.type === 'posts' || formData.type === 'featured') {
          const dirPath = path.substring(0, path.lastIndexOf('/'));
          try {
            await getRepoContents(dirPath);
          } catch (error) {
            if (error.message.includes('404')) {
              setStatusMessage(
                `Lỗi: Thư mục cha cho "${formData.title}" (${dirPath}) không tồn tại. Vui lòng tạo thủ công.`,
              );
              setLoading(false);
              return;
            }
            throw error;
          }
        }
        await createOrUpdateFile(path, content, commitMessage);
        setStatusMessage(`Tạo "${formData.title}" thành công!`);
      }
      setFormData({
        type: formData.type,
        title: '',
        date: new Date().toISOString().slice(0, 16),
        description: '',
        tags: '',
        body: '',
        imageFile: null,
        imageUrl: '',
        github: '',
        external: '',
        tech: '',
        company: '',
        range: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
      });
      fetchContent();
    } catch (error) {
      console.error('Error saving content:', error);
      setStatusMessage(`Lỗi khi lưu nội dung: ${error.message}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = post => {
    setEditingPost(post);
    setFormData({
      type: post.type,
      title: post.frontmatter.title || '',
      date: post.frontmatter.date
        ? new Date(post.frontmatter.date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      description: post.frontmatter.description || '',
      tags: Array.isArray(post.frontmatter.tags)
        ? post.frontmatter.tags.join(', ')
        : post.frontmatter.tags || '',
      body: post.body || '',
      imageUrl: post.frontmatter.image || '',
      github: post.frontmatter.github || '',
      external: post.frontmatter.external || '',
      tech: Array.isArray(post.frontmatter.tech)
        ? post.frontmatter.tech.join(', ')
        : post.frontmatter.tech || '',
      company: post.frontmatter.company || '',
      range: post.frontmatter.range || '',
      startDate: post.frontmatter.startDate || new Date().toISOString().slice(0, 10),
      endDate: post.frontmatter.endDate || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async post => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${post.frontmatter.title}"?`)) {
      return;
    }

    setLoading(true);
    setStatusMessage('');
    try {
      const commitMessage = `feat(${post.type}): Delete ${post.frontmatter.title}`;
      await deleteFile(post.path, commitMessage, post.sha);

      if (post.frontmatter.image) {
        const imagePathToDelete = post.frontmatter.image.startsWith('/')
          ? post.frontmatter.image.substring(1)
          : post.frontmatter.image;
        try {
          const imageInfo = await getRepoContents(imagePathToDelete);
          await deleteFile(
            imagePathToDelete,
            `feat(delete): Delete image for ${post.frontmatter.title}`,
            imageInfo.sha,
          );
          setStatusMessage(`Xóa "${post.frontmatter.title}" và ảnh liên quan thành công!`);
        } catch (imgDeleteError) {
          console.warn(`Could not delete image ${imagePathToDelete}:`, imgDeleteError);
          setStatusMessage(
            `Xóa "${post.frontmatter.title}" thành công, nhưng không thể xóa ảnh liên quan.`,
          );
        }
      } else {
        setStatusMessage(`Xóa "${post.frontmatter.title}" thành công!`);
      }

      fetchContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      setStatusMessage(`Lỗi khi xóa nội dung: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout location={location}>
      <StyledAdminContainer>
        <h1>{editingPost ? 'Chỉnh sửa Nội dung' : 'Tạo Nội dung Mới'}</h1>
        {statusMessage && <div className="status-message">{statusMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="type">Loại Nội dung</label>
            <select id="type" name="type" value={formData.type} onChange={handleTypeChange}>
              <option value="posts">Bài viết</option>
              <option value="projects">Dự án</option>
              <option value="featured">Dự án Nổi bật</option>
              <option value="jobs">Kinh nghiệm làm việc</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Tiêu đề</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {(formData.type === 'posts' || formData.type === 'featured') && (
            <div className="form-group">
              <label htmlFor="imageFile">Ảnh Bìa / Ảnh Đại diện (Tùy chọn)</label>
              <input
                type="file"
                id="imageFile"
                name="imageFile"
                accept="image/*"
                onChange={handleImageChange}
              />
              {formData.imageUrl && (
                <p>
                  Ảnh hiện tại:{' '}
                  <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer">
                    {formData.imageUrl.split('/').pop()}
                  </a>
                </p>
              )}
            </div>
          )}

          {formData.type === 'posts' && (
            <>
              <div className="form-group">
                <label htmlFor="date">Ngày (Bài viết)</label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Mô tả (Bài viết)</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="tags">Tags (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {(formData.type === 'projects' || formData.type === 'featured') && (
            <>
              <div className="form-group">
                <label htmlFor="description">Mô tả (Dự án)</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="github">URL GitHub</label>
                <input
                  type="text"
                  id="github"
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="external">URL Demo</label>
                <input
                  type="text"
                  id="external"
                  name="external"
                  value={formData.external}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="tech">Công nghệ (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  id="tech"
                  name="tech"
                  value={formData.tech}
                  onChange={handleChange}
                />
              </div>
              {formData.type === 'projects' && (
                <div className="form-group">
                  <label htmlFor="date">Ngày (Dự án)</label>
                  <input
                    type="datetime-local"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
            </>
          )}

          {formData.type === 'jobs' && (
            <>
              <div className="form-group">
                <label htmlFor="company">Công ty</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="range">Link Công ty (Tùy chọn)</label>
                <input
                  type="text"
                  id="range"
                  name="range"
                  value={formData.range}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="startDate">Ngày bắt đầu</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">Ngày kết thúc (Tùy chọn)</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="body">Nội dung (Markdown)</label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              required
            />
          </div>

          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : editingPost ? 'Cập nhật Nội dung' : 'Tạo Nội dung'}
            </button>
            {editingPost && (
              <button type="button" onClick={() => setEditingPost(null)} disabled={loading}>
                Hủy chỉnh sửa
              </button>
            )}
          </div>
        </form>

        <h2 className="section-title">Nội dung Hiện có</h2>
        {statusMessage && <div className="status-message">{statusMessage}</div>}
        {loading && <div className="status-message">Đang tải nội dung...</div>}
        {posts.length > 0 ? (
          <ul className="post-list">
            {posts.map(post => (
              <li key={post.path}>
                <div className="post-info">
                  <h3>{post.frontmatter.title || post.name}</h3>
                  <p>Loại: {post.type}</p>
                  <p>Đường dẫn: {post.path}</p>
                </div>
                <div className="post-actions">
                  <button onClick={() => handleEdit(post)}>Chỉnh sửa</button>
                  <button onClick={() => handleDelete(post)}>Xóa</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p>Chưa có nội dung nào.</p>
        )}
      </StyledAdminContainer>
    </Layout>
  );
};

export default AdminPage;
