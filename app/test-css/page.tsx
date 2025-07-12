export default function TestCSS() {
  return (
    <div className="p-8 bg-blue-500 text-white">
      <h1 className="text-2xl font-bold">CSS Test Page</h1>
      <p className="mt-4">If you can see this styled, CSS is working!</p>
      <div className="mt-4 p-4 bg-green-500 rounded-lg">
        <p>This should be green with rounded corners</p>
      </div>
    </div>
  )
}