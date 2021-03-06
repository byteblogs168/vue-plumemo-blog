import { Vue, Component } from 'vue-property-decorator';
import { VContainer, VForm, VTextField, VBtn, VIcon } from '@/components/vuetify-tsx';

@Component({
  name: 'theme-search',
  layout: 'fullscreen',
  transition: 'dialog-bottom-transition',
  head: {
    title: '搜索',
  },
})
export default class ThemeSearch extends Vue {
  searchText = '';

  render() {
    const container = (
      <VContainer class="search">
        <VForm>
          <VTextField
            v-model={this.searchText}
            solo
            dense={!this.$vuetify.breakpoint.mdAndUp}
            placeholder="Search"
            appendIcon="mdi-magnify"
            {...{
              on: {
                'click:append': () => {
                  this.searchText &&
                    this.$router.replace({ name: 'theme-search-result', params: { keywords: this.searchText } });
                },
              },
            }}
          ></VTextField>
          <p class="mb-2 caption">历史记录:</p>
        </VForm>
      </VContainer>
    );

    return this.$vuetify.breakpoint.mdAndUp ? (
      <div>
        <div class="mb-10 text-right">
          <VBtn icon large class="mt-5 mr-5" onClick={() => this.$router.back()}>
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </div>
        {container}
      </div>
    ) : (
      container
    );
  }
}
