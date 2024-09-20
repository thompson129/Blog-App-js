import { Alert, Box, Button, TextField } from "@mui/material";
import Item from "../components/Item";
import { queryClient } from "../ThemedApp";
import { useQuery, useMutation } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../ThemedApp";
import { postComment } from "../libs/fetcher";
import { useRef } from "react";

const api=import.meta.env.VITE_API;

export default function Comments(){
    const { id }=useParams();
    const navigate= useNavigate();
    const contentInput=useRef();
    const { auth, setGlobalMsg }=useApp();
    const { isLoading, isError, error, data }=useQuery("comments",
        async()=>{
            const res=await fetch(`${api}/content/posts/${id}`);
            return res.json();
        }
    );

    const addComment=useMutation(content=> postComment(content,id), {
        onSuccess: async comment=>{
            await queryClient.cancelQueries("comments");
            await queryClient.setQueryData("comments", old=> {
                old.comments=[...old.comments, comment];
                return { ...old };
            });
            setGlobalMsg("A comment added");
        },
    });

    const removePost=useMutation(
        async id=>{
            await fetch(`${api}/content/posts/${id}`,{
                method: "DELETE",
            });
            navigate("/");
            setGlobalMsg("A post deleted");
        });

    const removeComment = useMutation(
        async id => {
            await fetch(`${api}/content/comments/${id}`, {
                method: "DELETE",
            });
        },
        {
            onMutate: id => {
                queryClient.cancelQueries("comments");
                queryClient.setQueryData("comments", old=>{
                    old.comments=old.comments.filter(
                        comment=>comment.id !== id
                    );
                    return {...old};
                });
                setGlobalMsg("A comment deleted");
            },
        }
    );

    if(isError){
        return(
            <Box>
                <Alert severity="warning">{error.message}</Alert>
            </Box>
        );
    }
    if(isLoading){
        return <Box sx={{ textAlign: "center"}}>Loading...</Box>
    }

    return(
        <Box>
            <Item
            primary
            item={data}
            remove={removePost.mutate}
            />
            {data.comments.map(comment=>{
                return(
                    <Item comment key={comment.id} item={comment} remove={removeComment.mutate} />
                );
            })}
            {auth && (
                <form
                onSubmit={e => {
                    e.preventDefault();
                    const content=contentInput.current.value;
                    if(!content) return false;

                    addComment.mutate(content);
                    e.currentTarget.reset();
                }}>
                    <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        mt: 3,
                    }}>
                        <TextField 
                        inputRef={contentInput}
                        multiline
                        placeholder="Your Comment"
                        />
                        <Button 
                        type="submit"
                        variant="contained">
                            Reply
                        </Button>
                    </Box>
                </form>
            )}
        </Box>
    );
}