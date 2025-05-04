import fs from 'fs';
import path from 'path';

const auctions = [
  "instant", "silent", "luxury", "government", "companies",
  "buses", "private", "medical", "green"
];

const template = (name) => `
'use client';

const Page = () => {
  return <div className='p-10 text-center text-2xl'>صفحة مزاد ${name}</div>;
};

export default Page;
`;

auctions.forEach((slug) => {
  const dir = path.join("app", "auctions", slug);
  const filePath = path.join(dir, "page.tsx");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, template(slug), "utf8");
}); 