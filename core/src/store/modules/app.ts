import { VuexModule, Module, getModule } from 'vuex-module-decorators';
import { store } from '@/store';

@Module({ dynamic: true, store, name: 'app', namespaced: true })
class AppStore extends VuexModule {}

export default getModule(AppStore);
