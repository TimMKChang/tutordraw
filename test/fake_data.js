const users = [
  {
    id: 1,
    name: 'test1',
    email: 'test1@mail.com',
    password: 'test1password',
    created_at: Date.parse(new Date('2020-07-01')),
  },
  {
    id: 2,
    name: 'test2',
    email: 'test2@mail.com',
    password: 'test2password',
    created_at: Date.parse(new Date('2020-07-01')),
  },
  {
    id: 3,
    name: 'test3',
    email: 'test3@mail.com',
    password: 'test3password',
    created_at: Date.parse(new Date('2020-07-01')),
  }
];

const rooms = [
  {
    id: 'room1',
    token: 'token1',
    title: 'title1',
  },
  {
    id: 'room2',
    token: 'token2',
    title: 'title2',
  }
];

const roomUsers = [
  {
    room_id: 'room1',
    user_id: 2,
    is_owner: true,
    note: 'note1',
    starred: true,
  },
  {
    room_id: 'room2',
    user_id: 2,
    is_owner: true,
    note: 'note2',
    starred: true,
  }
];

const whiteboards = [
  {
    id: 1,
    room_id: 'room1',
    start_at: Date.parse(new Date('2020-07-01')),
    link: 'link1',
  },
  {
    id: 2,
    room_id: 'room1',
    start_at: Date.parse(new Date('2020-07-02')),
    link: null,
  },
  {
    id: 3,
    room_id: 'room2',
    start_at: Date.parse(new Date('2020-07-03')),
    link: null,
  }
];

const pins = [
  {
    whiteboard_id: 1,
    user_id: 2,
    author: 'test2',
    x: 1,
    y: 1,
    content: 'content1',
    created_at: Date.parse(new Date('2020-07-01')),
    removed_at: null,
  },
  {
    whiteboard_id: 1,
    user_id: 2,
    author: 'test2',
    x: 2,
    y: 2,
    content: 'content2',
    created_at: Date.parse(new Date('2020-07-02')),
    removed_at: null,
  },
  {
    whiteboard_id: 1,
    user_id: 2,
    author: 'test2',
    x: 3,
    y: 3,
    content: 'content3',
    created_at: Date.parse(new Date('2020-07-03')),
    removed_at: Date.parse(new Date('2020-07-03')),
  }
];

module.exports = {
  users,
  rooms,
  roomUsers,
  whiteboards,
  pins,
};
