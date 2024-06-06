const allowedTypes = ['text/html', 'text/plain']

export function paste(editor, event) {
  console.log(event.clipboardData.types)
  for (const allowedType of allowedTypes) {
    if (event.clipboardData.types.includes(allowedType)) {
      const data = event.clipboardData.getData(allowedType)
      console.log(data)
    }
  }
}
