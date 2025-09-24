package com.code.codingplatform.model;

public enum InputFormatType {
    // Single Value Inputs
    SINGLE_INTEGER,
    SINGLE_FLOAT,
    SINGLE_DOUBLE,
    SINGLE_CHAR,
    SINGLE_BOOLEAN,
    SINGLE_STRING,

    // Two Value Inputs
    TWO_INTEGERS,
    TWO_FLOATS,
    TWO_DOUBLES,
    TWO_CHARS,
    TWO_BOOLEANS,
    TWO_STRINGS,

    // Array Inputs
    SINGLE_INTEGER_ARRAY,
    SINGLE_FLOAT_ARRAY,
    SINGLE_DOUBLE_ARRAY,
    SINGLE_CHAR_ARRAY,
    SINGLE_STRING_ARRAY,
    SINGLE_BOOLEAN_ARRAY,

    // Multiple Array Inputs
    TWO_INTEGER_ARRAYS,
    TWO_FLOAT_ARRAYS,
    TWO_DOUBLE_ARRAYS,
    TWO_CHAR_ARRAYS,
    TWO_STRING_ARRAYS,
    TWO_BOOLEAN_ARRAYS,
    THREE_INTEGER_ARRAYS,
    THREE_STRING_ARRAYS,

    // Matrix Inputs
    INTEGER_MATRIX,
    CHAR_MATRIX,
    STRING_MATRIX,
    BOOLEAN_MATRIX,

    // Mixed Type Inputs
    INTEGER_AND_ARRAY,           // n, then array of n elements
    INTEGER_AND_STRING,          // n, then string
    INTEGER_AND_TWO_ARRAYS,      // n, then two arrays
    STRING_AND_INTEGER,          // string, then integer
    STRING_AND_ARRAY,            // string, then array

    // Multiple Lines
    MULTIPLE_INTEGERS,           // Multiple integers on separate lines
    MULTIPLE_STRINGS,            // Multiple strings on separate lines
    MULTIPLE_LINES_MIXED,        // Mixed types on multiple lines

    // Tree/Graph Inputs (LeetCode Style)
    BINARY_TREE_ARRAY,          // [1,2,3,null,null,4,5] format
    GRAPH_ADJACENCY_LIST,       // [[1,2],[0,2],[0,1]] format
    GRAPH_EDGES_LIST,           // [[0,1],[1,2],[2,0]] format
    LINKED_LIST_ARRAY,          // [1,2,3,4,5] format

    // Special LeetCode Formats
    INTERVALS_ARRAY,            // [[1,3],[2,6],[8,10]] format
    COORDINATES_ARRAY,          // [[0,0],[1,1],[2,2]] format
    KEY_VALUE_PAIRS,            // [["key1","val1"],["key2","val2"]] format

    // Complex Nested Structures
    NESTED_INTEGER_ARRAY,       // [[1,2],[3,4,5],[6]] format
    NESTED_STRING_ARRAY,        // [["a","b"],["c","d","e"]] format
    ARRAY_OF_OBJECTS,           // Complex object arrays

    // Variable Length Inputs
    VARIABLE_INTEGERS,          // First line: count, then that many integers
    VARIABLE_STRINGS,           // First line: count, then that many strings
    VARIABLE_ARRAYS,            // First line: count, then that many arrays

    // Test Case Specific
    MULTIPLE_TEST_CASES,        // T test cases, each with different format
    UNTIL_EOF,                  // Read until end of file
    CUSTOM_FORMAT               // For very specific custom formats
}
