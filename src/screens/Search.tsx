import React, { useState } from 'react';
import { View, TextInput, FlatList } from 'react-native';
import { searchMusic } from '../api/api';
import SongItem from '../components/SongItem';

const Search = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await searchMusic(query);
    setResults(res);
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Search song"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <FlatList
        data={results}
        keyExtractor={(item: any) => item.video_id}
        renderItem={({ item }) => (
          <SongItem
            item={item}
            onPress={() => navigation.navigate('Player', { song: item })}
          />
        )}
      />
    </View>
  );
};

export default Search;
