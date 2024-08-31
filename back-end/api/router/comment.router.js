import { Router } from "express";
import {
  createComment,
  getPostComments,
  likeComments,
  editComments,
  deleteComments,
} from "../controllers/comment.controller.js";
import { verifyToken } from "../func/verifyUser.js";

const commentRoute = Router();

commentRoute.post("/create", verifyToken, createComment);
commentRoute.get("/getPostComment/:postId", getPostComments);
commentRoute.put("/likeComment/:commentId", verifyToken, likeComments);
commentRoute.put("/editComment/:commentId", verifyToken, editComments);
commentRoute.delete("/deleteComment/:commentId", verifyToken, deleteComments);
export default commentRoute;
