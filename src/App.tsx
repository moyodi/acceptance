import { useRoute } from './lib/router';
import { ListPage } from './pages/ListPage';
import { EditorPage } from './pages/EditorPage';

export default function App() {
  const route = useRoute();
  return route.name === 'doc' ? <EditorPage docId={route.id} /> : <ListPage />;
}
