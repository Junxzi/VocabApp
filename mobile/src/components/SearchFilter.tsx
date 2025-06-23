import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export type SortOption = 'alphabetical' | 'date' | 'difficulty';
export type ViewMode = 'grid' | 'list';

interface SearchFilterProps {
  searchQuery: string;
  selectedTags: string[];
  availableTags: string[];
  sortBy: SortOption;
  viewMode: ViewMode;
  totalCount: number;
  onSearch: (q: string) => void;
  onTagFilter: (tags: string[]) => void;
  onSortChange: (s: SortOption) => void;
  onViewModeChange: (m: ViewMode) => void;
  onGenerateWords?: (tagName: string) => void;
}

export function SearchFilter({
  searchQuery,
  selectedTags,
  availableTags,
  sortBy,
  viewMode,
  totalCount,
  onSearch,
  onTagFilter,
  onSortChange,
  onViewModeChange,
  onGenerateWords,
}: SearchFilterProps) {
  const [showTagModal, setShowTagModal] = useState(false);

  return (
    <View style={styles.wrapper}>
      {/* Search Input */}
      <View style={styles.searchBox}>
        <Icon name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="単語を検索"
          value={searchQuery}
          onChangeText={onSearch}
        />
      </View>

      {/* Tag Filter Button */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowTagModal(true)}
        >
          <Icon name="local-offer" size={18} color="#444" />
          <Text style={styles.btnText}>タグ ({selectedTags.length})</Text>
        </TouchableOpacity>
        {/* Selected Tags */}
        <View style={styles.tagList}>
          {selectedTags.map(tag => (
            <View key={tag} style={styles.tagItem}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => onTagFilter(selectedTags.filter(t=>t!==tag))}>
                <Icon name="close" size={16} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Sort & View Toggle & Generate */}
      <View style={styles.row}>  
        <TouchableOpacity style={styles.button} onPress={() => onSortChange(
          sortBy === 'alphabetical' ? 'date' : sortBy === 'date' ? 'difficulty' : 'alphabetical'
        )}>
          <Icon name="sort" size={18} color="#444" />
          <Text style={styles.btnText}>{sortBy}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => onViewModeChange(viewMode==='grid'?'list':'grid')}>
          <Icon name={viewMode==='grid'?'grid-view':'view-list'} size={18} color="#444" />
        </TouchableOpacity>
        {onGenerateWords && (
          <TouchableOpacity style={styles.button} onPress={() => onGenerateWords(selectedTags[0]||'')}>
            <Icon name="auto-awesome" size={18} color="#8844ee" />
          </TouchableOpacity>
        )}
      </View>

      {/* Count */}
      <Text style={styles.countText}>{totalCount} 件</Text>

      {/* Tag Modal */}
      <Modal visible={showTagModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>タグを選択</Text>
          <FlatList
            data={availableTags}
            keyExtractor={item=>item}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.modalItem, selectedTags.includes(item)&&styles.modalItemSelected]}
                onPress={() => {
                  const next = selectedTags.includes(item)
                    ? selectedTags.filter(t=>t!==item)
                    : [...selectedTags, item];
                  onTagFilter(next);
                }}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalClose} onPress={()=>setShowTagModal(false)}>
            <Text>閉じる</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:{padding:8,backgroundColor:'#fff'},
  searchBox:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#ccc',padding:4,borderRadius:4},
  searchInput:{flex:1,marginLeft:4,height:32},
  row:{flexDirection:'row',alignItems:'center',marginTop:8,flexWrap:'wrap'},
  button:{flexDirection:'row',alignItems:'center',padding:6,marginRight:8,borderWidth:1,borderColor:'#888',borderRadius:4},
  btnText:{marginLeft:4},
  tagList:{flexDirection:'row',flexWrap:'wrap',flex:1},
  tagItem:{flexDirection:'row',backgroundColor:'#eee',padding:4,borderRadius:12,alignItems:'center',marginRight:4,marginBottom:4},
  tagText:{marginRight:4},
  countText:{marginTop:4,color:'#666'},
  modalContainer:{flex:1,padding:16,backgroundColor:'#fff'},
  modalTitle:{fontSize:18,marginBottom:12},
  modalItem:{padding:8},
  modalItemSelected:{backgroundColor:'#ddd'},
  modalClose:{padding:12,alignItems:'center',marginTop:12,borderTopWidth:1,borderColor:'#ccc'},
});

// NOTE: `styles` は上で定義済みのため重複宣言は削除しました