all:
	cmake -B build .
	cmake --build build --config MinSizeRel

debug:
	cmake -B build .
	cmake --build build --config Debug

format:
	clang-format -i src/*.cpp

run:
	echo -n 020000007b7d | xxd -r -p | build/keeweb-native-messaging-host keeweb-connect-addon@keeweb.info

tests:
	../../node_modules/.bin/mocha test/native-messaging-host-test.mjs
