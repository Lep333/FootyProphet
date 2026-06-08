import { reddit } from '@devvit/web/server';

export const createPost = async (title: string, entrypoint: string = "default") => {
  return await reddit.submitCustomPost({
    title: title,
    entry: entrypoint,
  });
};
