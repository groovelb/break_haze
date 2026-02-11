---
name: add-artist
description: 새로운 아티스트와 앨범을 타임라인에 추가합니다
argument-hint: [아티스트명]
---

새로운 아티스트/앨범을 "The Break & The Haze" 타임라인에 추가합니다.

## 입력

사용자가 `$ARGUMENTS`로 아티스트명을 전달합니다. 아티스트명이 없으면 사용자에게 물어보세요.

## 절차

1. 해당 아티스트가 90년대 Big Beat 또는 Trip-hop 장르에 해당하는지 확인
2. `constants.ts`의 `ALBUMS_DATA` 배열에 `ArtistGroup` 형태로 추가
3. 필수 필드:
   - `artist`: 아티스트명
   - `genre`: 장르 (예: "Trip-hop", "Big Beat")
   - `genre_style`: `"thunder"` (Big Beat 계열) 또는 `"cloud"` (Trip-hop 계열)
   - `albums`: 앨범 배열 — 각 앨범에 `year`, `title`, `key_track`, `search_query` 포함
4. `search_query`는 iTunes Search API에서 검색할 수 있는 형태로 작성
5. 연도 범위는 주로 1990~2005년대

## 중요

- `types.ts`의 `ArtistGroup`, `RawAlbumData` 인터페이스를 따를 것
- 기존 데이터 형식과 일관성 유지
- 장르가 맞지 않으면 사용자에게 알리고 확인 받기
