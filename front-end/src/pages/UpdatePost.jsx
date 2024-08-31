import { Button, FileInput, Select, TextInput } from "flowbite-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase.js";
import { useApi } from "../context/ApiContext.jsx";
import { useEffect, useState, useRef } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const UpdatePost = () => {
  const [imgFile, setImgFile] = useState(null);
  const api = useApi();
  const { postId } = useParams();
  const [imageUploadProgress, setImageUploadProgress] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "uncategorized",
    content: "",
    image: "",
  });
  const [imgIsUploading, setImgIsUploading] = useState(false);

  const navigate = useNavigate();
  const didFetchPost = useRef(false); // Add this ref to track whether the post has been fetched

  const handleImgChange = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) {
      setImgFile(file);
    }
  };

  useEffect(() => {
    async function getPost() {
      if (didFetchPost.current) return; // Prevent double fetching
      didFetchPost.current = true;

      try {
        const res = await api.get(
          import.meta.env.VITE_GET_SINGLE_POST_ROUTE + postId,
          {
            headers: {
              "Content-Type": import.meta.env.VITE_SUP_SIN_HEADERS,
            },
          }
        );
        if (res.status === 200) {
          setFormData(res.data.posts[0]);
          toast.success("Post is here!");
          setTimeout(() => {
            // navigate(`/post/${res.data.post.slug}`);
          }, 4000);
        } else {
          console.log(res.data);
          setFormData({});
          return toast.error("Update is Failure!");
        }
      } catch (error) {
        console.log(error);
        const err =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";
        return toast.error(err);
      }
    }
    getPost();
  }, [api, postId]);

  useEffect(() => {
    if (imgFile) {
      handleUploadImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgFile]);

  const handleUploadError = (error) => {
    const err =
      error.response?.data?.message || error.message || "Image upload failed!";
    toast.error(err);
    setImageUploadProgress(null);
    setImgFile(null);
    setImgIsUploading(false);
  };

  const handleUploadImage = async () => {
    try {
      if (!imgFile) {
        toast.warn("Please Upload an Image!");
        return;
      }
      setImgIsUploading(true);
      const storage = getStorage(app);
      const fileName = new Date().getTime() + "-" + imgFile.name;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, imgFile);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setImageUploadProgress(progress.toFixed(0));
        },
        (error) => {
          handleUploadError(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setImageUploadProgress(null);
            setFormData({ ...formData, image: downloadURL });
            setImgIsUploading(false);
          });
        }
      );
    } catch (error) {
      handleUploadError(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(formData).length === 0) {
      return toast.warn("No changes made!");
    }
    if (imgIsUploading) {
      return toast.warn("Image is Uploading. Please Wait!");
    }
    if (
      formData.title === "" ||
      formData.content === "" ||
      formData.image === ""
    ) {
      return toast.warn("Please fill in all fields!");
    }

    try {
      const res = await api.put(
        import.meta.env.VITE_EDIT_SINGLE_POST_ROUTE + postId,
        formData,
        import.meta.env.VITE_SUP_SIN_HEADERS
      );
      if (res.status === 200) {
        setFormData({});
        toast.success("Post is Updated!");
        setTimeout(() => {
          // navigate(`/post/${res.data.post.slug}`);
        }, 4000);
      } else {
        console.log(res.data);
        setFormData({});
        return toast.error("Update is Failure!");
      }
    } catch (error) {
      const err =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
      toast.error(err);
      setImageUploadProgress(null);
      console.log(error);
    }
  };

  return (
    <div className="p-3 max-w-3xl mx-auto min-h-screen">
      <h1 className="text-center text-3xl my-7 font-semibold">Update a post</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 sm:flex-row justify-between">
          <TextInput
            value={formData?.title}
            type="text"
            placeholder="Title"
            id="title"
            className="flex-1"
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <Select
            value={formData?.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            <option value="uncategorized" disabled>
              Select a category
            </option>
            <option value="javascript">JavaScript</option>
            <option value="reactjs">React.js</option>
            <option value="nextjs">Next.js</option>
          </Select>
        </div>
        <div className="flex gap-4 items-center justify-between border-4 border-teal-500 border-dotted p-3">
          <FileInput type="file" accept="image/*" onChange={handleImgChange} />
        </div>
        {imageUploadProgress && (
          <div className="w-16 h-16 mx-auto">
            <CircularProgressbar
              value={imageUploadProgress}
              text={`${imageUploadProgress || 0}%`}
            />
          </div>
        )}
        {formData.image && (
          <img
            src={formData.image}
            alt="upload"
            className="w-full h-72 object-cover"
          />
        )}
        <ReactQuill
          value={formData?.content}
          theme="snow"
          placeholder="Write something..."
          className="h-72 mb-12"
          required
          onChange={(value) => {
            setFormData({ ...formData, content: value });
          }}
        />
        <Button type="submit" gradientDuoTone="purpleToPink">
          Update
        </Button>
      </form>
    </div>
  );
};

export default UpdatePost;
