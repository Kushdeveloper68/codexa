export const LANGUAGE_SNIPPETS = {
  JavaScript: `// Start coding together...

function main() {
  console.log("Hello, CodeClass!");
}

main();
`,
  Python: `# Start coding together...

def main():
    print("Hello, CodeClass!")

if __name__ == "__main__":
    main()
`,
  Java: `// Start coding together...

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeClass!");
    }
}
`,
  "C++": `// Start coding together...

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, CodeClass!" << endl;
    return 0;
}
`,
  C: `// Start coding together...

#include <stdio.h>

int main() {
    printf("Hello, CodeClass!\\n");
    return 0;
}
`,
};

export const SUPPORTED_LANGUAGES = ["JavaScript", "Python", "Java", "C++", "C"];

export function getSnippet(language) {
  return LANGUAGE_SNIPPETS[language] || LANGUAGE_SNIPPETS.JavaScript;
}
