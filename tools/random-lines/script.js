function clearInput()
{
    document.getElementById('text_input').value = '';
}

function clearOutput()
{
    document.getElementById('text_output').value = '';
}

function selectLines()
{
    var numberOfLinesToSelect = document.getElementById('number_of_lines').value;
    var arrayOfLines = document.getElementById('text_input').value.replace(/\r/g, '').split('\n');

    if (numberOfLinesToSelect < 1)
    {
        numberOfLinesToSelect = 0
    }

    if (numberOfLinesToSelect > arrayOfLines.length)
    {
        numberOfLinesToSelect = arrayOfLines.length;
    }

    var result = [];
    for (var i = 0; i < numberOfLinesToSelect; i++)
    {
        // Select a random line
        var selectedLineNum = Math.floor(Math.random() * arrayOfLines.length);
        console.log(selectedLineNum);
        result.push(arrayOfLines[selectedLineNum]);

        // Remove the selected line from the input
        arrayOfLines.splice(selectedLineNum, 1);
    }
    // Set the output text
    document.getElementById('text_output').value = result.join('\n');

    // Update the input text
    document.getElementById('text_input').value = arrayOfLines.join('\n');
}

function copyOutput(event)
{
    navigator.clipboard.writeText(document.getElementById("text_output").value);
    var dummy = document.createElement("div");

    // Get the cursor location with an offset
    var x = event.clientX - 120;
    var y = event.clientY - 120;

    // Set the location of the dummy element to the cursor location
    dummy.style.position = "absolute";
    dummy.style.left = x + "px";
    dummy.style.top = y + "px";

    document.body.appendChild(dummy);
    dummy.setAttribute("id", "dummy_id");
    document.getElementById("dummy_id").innerHTML = '<div class="nes-balloon from-right copied-balloon"><p>copied!!</p></div>';

    setTimeout(function () { document.getElementById("dummy_id").remove(); }, 800);
}
