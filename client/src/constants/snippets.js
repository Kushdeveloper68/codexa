export const LANGUAGE_SNIPPETS = {
  JavaScript: `// Start coding together...

function main() {
  console.log("Hello, codexa!");
}

main();
`,
  Python: `# Start coding together...

def main():
    print("Hello, codexa!")

if __name__ == "__main__":
    main()
`,
  Java: `// Start coding together...

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, codexa!");
    }
}
`,
  "C++": `// Start coding together...

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, codexa!" << endl;
    return 0;
}
`,
  C: `// Start coding together...

#include <stdio.h>

int main() {
    printf("Hello, codexa!\\n");
    return 0;
}
`,
};

export const SUPPORTED_LANGUAGES = ["JavaScript", "Python", "Java", "C++", "C"];

export function getSnippet(language) {
  return LANGUAGE_SNIPPETS[language] || LANGUAGE_SNIPPETS.JavaScript;
}
