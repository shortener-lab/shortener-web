import { CreateLinkForm } from '../components/CreateLinkForm';
import { LinkList } from '../components/LinkList';

export function LinksPage() {
  return (
    <>
      <h1>Meus links</h1>
      <CreateLinkForm />
      <h2>Criados por você</h2>
      <LinkList />
    </>
  );
}
