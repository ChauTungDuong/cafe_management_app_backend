export default () => {
  return {
    port: parseInt(process.env.APP_PORT, 10) || 3000,
    name: process.env.APP_NAME || 'cafe_management_backend',
    nodeEnv: process.env.NODE_ENV || 'development',
  };
};
