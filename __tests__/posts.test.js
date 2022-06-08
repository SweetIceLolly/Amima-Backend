const utils = require('./test_utils');

module.exports.post_tests = () => {
  describe('Tests for POST /post & GET /post/:id', () => {
    /**
     * Create a post and then retrieve it
     * - POST /post
     * - GET /post/:id
     */
    test('Creating & retrieving posts', async () =>{
      const post_content = {
        title: 'Test post',
        content: 'This is a test post',
        images: ['image1.png', 'image2.png'],
        keywords: ['test', 'post']
      };

      const res = await utils.http_post(utils.API_URL + '/post', post_content, utils.TONY_TOKEN);
      expect(res.status).toBe(201);
      expect(res.data.message).toBe('Post created');
      expect(res.data.postId).toBeDefined();

      const post = await utils.http_get(utils.API_URL + '/post/' + res.data.postId);
      expect(post.status).toBe(200);
      expect(post.data.title).toBe(post_content.title);
      expect(post.data.content).toBe(post_content.content);
      expect(post.data.images).toEqual(post_content.images);
      expect(post.data.keywords).toEqual(post_content.keywords);
      expect(post.data.posterId).toEqual({
        _id: utils.get_tony()._id.toString(),
        user_name: utils.get_tony().user_name,
        profile_image: utils.get_tony().profile_image,
        bio: utils.get_tony().bio
      });
      expect(post.data.postDate).toBeDefined();
    });

    /**
     * Test invalid requests for creating a post
     * - POST /post
     */
    test('Create a post while not logged in', async () =>{
      const post_content = {
        title: 'Test post',
        content: 'This is a test post',
        images: ['image1.png', 'image2.png'],
        keywords: ['test', 'post']
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('401');
    });

    test('Create a post with an invalid token', async () =>{
      const post_content = {
        title: 'Test post',
        content: 'This is a test post',
        images: ['image1.png', 'image2.png'],
        keywords: ['test', 'post']
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('401');
    });

    test('Create a post with no title', async () =>{
      const post_content = {
        title: '',
        content: 'This is a test post',
        images: ['image1.png', 'image2.png'],
        keywords: ['test', 'post']
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');
      
    });

    test('Create a post with title too long', async () =>{
      const post_content = {
        title: '#'.repeat(26),
        content: 'This is a test post',
        images: ['image1.png', 'image2.png'],
        keywords: ['test', 'post']
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

    });

    test('Create a post with no content', async () =>{
      const post_content = {
        title: 'Test post',
        content: '',
        images: ['image1.png', 'image2.png'],
        keywords: ['test', 'post']
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

    });

    test('Create a post with content too long', async () =>{
      const post_content = {
        title: 'Test post',
        content: '#'.repeat(2001),
        images: ['image1.png', 'image2.png'],
        keywords: ['test', 'post']
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

    });

    test('Create a post with no images', async () =>{
      const post_content = {
        title: 'Test post',
        content: 'This is a test post',
        images: [],
        keywords: ['test', 'post']
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

    });

    test('Create a post with too many images', async () =>{
      const post_content = {
        title: 'Test post',
        content: 'This is a test post',
        images: ['image1.png','image2.png','image3.png','image4.png','image5.png','image6.png','image7.png','image8.png','image9.png','image10.png','image11.png'],
        keywords: ['test', 'post']
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

    });

    test('Create a post with images that are not exist', async () =>{
      // TODO
    });

    test('Create a post with invalid type of keywords', async () =>{
      const post_content = {
        title: 'Test post',
        content: 'This is a test post',
        images: ['image1.png','image2.png'],
        keywords: [1,2]
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

    });

    test('Create a post with too many keywords', async () =>{
      const post_content = {
        title: 'Test post',
        content: 'This is a test post',
        images: ['image1.png','image2.png'],
        keywords: ['test', 'post', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
      };

      return expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

    });

    test('Create a post with invalid keywords', async () =>{
      const post_content = {
        title: 'Test post',
        content: 'This is a test post',
        images: ['image1.png','image2.png'],
        keywords: ['#'.repeat(11)]
      };

      expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

      post_content.keywords = ['/'];

      expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

      post_content.keywords = ['\\'];

      expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

      post_content.keywords = [' '];

      expect(utils.http_post(utils.API_URL + '/post', post_content)).rejects.toContain('400');

    });

    /**
     * Test invalid requests for retrieving a post
     * - GET /post/:id
     */

    // TODO: Test some invalid cases
  });

  describe('Tests for DELETE /deletepost/:id', () => {
    /**
     * Create a post and then delete it using
     * - POST /post
     * - DELETE /post/:id
     */
    test('Creating & deleting posts', async () =>{

    });

    /**
     * Test invalid requests for deleting a post
     * - DELETE /post/:id
     */
    test('Delete a post while not logged in', async () =>{

    });

    // TODO: Test more invalid cases
  });

  describe('Tests for GET /postbyuser/:id', () => {
    /**
     * Create posts using different users then retrieve them by user ID
     * - POST /post
     * - GET /postbyuser/:id
     */
    test('Creating & retrieving posts by user ID', async () =>{

    });

    /**
     * Test invalid requests for retrieving a post by user ID
     * - GET /postbyuser/:id
     */

    // TODO: Test some invalid cases
  });

  describe('Tests for POST /postimage', () => {

  });

  describe('Tests for POST /searchPost', () => {

  });

  describe('Tests for GET /newestposts', () => {

  });

  describe('Tests for POST /editPost', () => {

  });

  describe('Tests for POST /deletePostImage', () => {

  });
}
