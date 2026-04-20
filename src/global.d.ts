declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css?inline' {
  const content: string;
  export default content;
}

interface Window {
  Executor: {
    execute: (command: string, alpine?: boolean) => Promise<string>;
  };
}
